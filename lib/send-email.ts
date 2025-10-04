import { createClient } from "@/lib/supabase/client";
import { adminLogger } from "@/lib/logger";

const isEmailEnabled = process.env.NODE_ENV === "production";


export const sendEmail = async (
  email: string | string[],
  subject: string,
  body: string,
) => {
  if (!isEmailEnabled) {
    adminLogger.info("이메일 전송 비활성화");
    return { data: null, error: null };
  }

  const supabase = createClient();
  const emails = Array.isArray(email) ? email : [email];
  try {
    const { data, error } = await supabase.functions.invoke("resend", {
      body: { to: emails, subject, html: body },
    });

    if (error) {
      adminLogger.error("이메일 전송 오류:", error);
      throw error;
    }
    
    adminLogger.info("이메일 전송 성공:", data);
    return { data, error: null };
  } catch (err) {
    adminLogger.error("이메일 전송 중 예외 발생:", err);
    return { data: null, error: err };
  }
};
