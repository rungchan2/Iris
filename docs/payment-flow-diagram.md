## 플로우 그래프

``````mermaid

graph TB
    Start([사용자: 결제하기 클릭]) --> Prepare[API: POST /payments/prepare]
    
    Prepare --> PrepareValidate{상품/금액 검증}
    PrepareValidate -->|실패| PrepareError[Error: 400 잘못된 요청]
    PrepareValidate -->|성공| CreatePending[payments 생성<br/>status: pending]
    
    CreatePending --> ReturnOrderId[orderId 반환]
    ReturnOrderId --> TossSDK[토스 결제창 호출]
    
    TossSDK --> UserInput[사용자: 카드정보 입력]
    UserInput --> TossProcess{토스 내부 처리}
    
    TossProcess -->|승인 거부| TossFail[토스: failUrl 리다이렉트]
    TossProcess -->|승인 성공| TossSuccess[토스: successUrl 리다이렉트]
    
    TossFail --> FailHandler[API: GET /payments/fail]
    FailHandler --> UpdateFailed[payments.status = failed<br/>error_message 저장]
    UpdateFailed --> LogFail[payment_logs 기록<br/>event_type: toss_failed]
    LogFail --> FailPage[303 → /payment/fail]
    
    TossSuccess --> SuccessHandler[API: GET /payments/success]
    
    SuccessHandler --> Step1{Step 1: 조회 및 검증}
    Step1 -->|orderId 없음| Error404[Error: 결제 정보 없음]
    Step1 -->|금액 불일치| FraudDetect[사기 시도 감지<br/>status: fraud_detected]
    Step1 -->|이미 paid| AlreadyPaid[303 → /payment/complete<br/>중복 처리 방지]
    Step1 -->|정상| Step2
    
    Step2[Step 2: 상태 잠금] --> LockUpdate[UPDATE payments<br/>SET status = processing<br/>WHERE status = pending]
    
    LockUpdate --> LockCheck{UPDATE 결과}
    LockCheck -->|0 rows| Concurrent[동시 요청 감지]
    Concurrent --> CheckStatus{현재 상태 조회}
    CheckStatus -->|paid| AlreadyPaid
    CheckStatus -->|processing| WaitPage[대기 페이지<br/>3초 후 재조회]
    CheckStatus -->|failed| FailPage
    
    LockCheck -->|1 row| LogProcessing[payment_logs 기록<br/>event_type: processing_start]
    
    LogProcessing --> Step3[Step 3: 토스 승인 API]
    
    Step3 --> TossAPI[POST /v1/payments/confirm<br/>orderId, amount, paymentKey]
    
    TossAPI --> TossTimeout{타임아웃 체크<br/>10초}
    TossTimeout -->|타임아웃| TimeoutHandle[status: timeout<br/>payment_logs 기록]
    TimeoutHandle --> TimeoutMsg[안내: 처리 중입니다<br/>주문내역 확인 요청]
    TimeoutMsg --> WebhookWait[Webhook으로<br/>최종 결과 대기]
    
    TossTimeout -->|정상 응답| TossResult{토스 응답}
    
    TossResult -->|실패| TossReject[토스 거부<br/>카드한도/잔액부족 등]
    TossReject --> UpdateTossFailed[status: failed<br/>error_message 저장]
    UpdateTossFailed --> LogTossFail[payment_logs 기록<br/>event_type: toss_rejected]
    LogTossFail --> FailPage
    
    TossResult -->|성공| Step4[Step 4: 결제 완료 업데이트]
    
    Step4 --> UpdatePaid[UPDATE payments<br/>SET status = paid<br/>provider_transaction_id<br/>paid_at, card_info 등<br/>WHERE status = processing]
    
    UpdatePaid --> UpdateCheck{UPDATE 결과}
    UpdateCheck -->|0 rows| StateError[상태 불일치 에러]
    StateError --> CriticalLog[Critical 로그 기록<br/>관리자 알림]
    
    UpdateCheck -->|1 row| LogPaid[payment_logs 기록<br/>event_type: payment_completed]
    
    LogPaid --> Step5[Step 5: 연관 데이터 업데이트]
    
    Step5 --> UpdateInquiry[inquiries 업데이트<br/>payment_id, status]
    UpdateInquiry --> InquiryCheck{업데이트 성공?}
    InquiryCheck -->|실패| InquiryError[로그 기록<br/>계속 진행]
    InquiryCheck -->|성공| CalcSettlement
    
    InquiryError --> CalcSettlement[정산 금액 계산]
    CalcSettlement --> CreateSettlement[settlement_items 생성<br/>platform_fee, tax_amount]
    
    CreateSettlement --> SettlementCheck{생성 성공?}
    SettlementCheck -->|실패| SettlementError[로그 기록<br/>recovery_queue 추가<br/>관리자 알림]
    SettlementCheck -->|성공| SuccessRedirect
    
    SettlementError --> SuccessRedirect[303 → /payment/complete<br/>Cache-Control: no-store]
    
    SuccessRedirect --> CompletePage[결제 완료 페이지]
    
    CompletePage --> ClientVerify[서버 재검증 API 호출<br/>/payments/verify]
    ClientVerify --> VerifyCheck{실제 paid?}
    VerifyCheck -->|아니요| ForceFailPage[강제 이동<br/>/payment/fail]
    VerifyCheck -->|예| ShowSuccess[성공 화면 표시]
    
    ShowSuccess --> HistoryBlock[히스토리 조작<br/>뒤로가기 차단]
    
    FraudDetect --> AlertAdmin[관리자 알림<br/>사기 시도]
    AlertAdmin --> LogFraud[payment_logs 기록<br/>event_type: fraud_attempt<br/>IP, user_id 저장]
    LogFraud --> FailPage
    
    Error404 --> FailPage
    StateError --> RecoveryQueue[payment_recovery_queue<br/>추가]
    RecoveryQueue --> SuccessRedirect
    
    style Start fill:#e1f5ff
    style CompletePage fill:#d4edda
    style FailPage fill:#f8d7da
    style FraudDetect fill:#fff3cd
    style CriticalLog fill:#ff6b6b
    style TimeoutHandle fill:#ffc107
    style AlreadyPaid fill:#d4edda

``````