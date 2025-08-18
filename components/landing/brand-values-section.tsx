"use client"

export function BrandValuesSection() {
  const values = [
    {
      title: "진정성",
      description: "당신만의 고유한 이야기와 감성을 담아냅니다",
      icon: "💎"
    },
    {
      title: "개성",
      description: "획일화된 틀이 아닌, 개인의 특별함을 발견합니다",
      icon: "🌟"
    },
    {
      title: "연결",
      description: "사진을 통해 진정한 자아와 만나는 여정을 함께합니다",
      icon: "🤝"
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            우리의 가치
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            <b>아이리즈</b>는 단순한 사진 촬영을 넘어, <br />
            당신의 내면을 발견하고 표현하는 특별한 경험을 제공합니다
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {values.map((value, index) => (
            <div 
              key={index}
              className="text-center group hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="text-6xl mb-6 group-hover:animate-bounce">
                {value.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {value.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <blockquote className="text-xl md:text-2xl text-gray-800 font-medium italic leading-relaxed">
            "왜 어떤 사진은 마음에 들고 어떤 건 아닐까?<br />
            그 답을 찾아드려요"
            </blockquote>
          </div>
        </div>
        <div className="mt-16 text-center">
          <div className="bg-yellow-50 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <blockquote className="text-xl md:text-2xl text-gray-800 font-medium italic leading-relaxed">
              "모든 사람은 고유한 아름다움을 가지고 있습니다. <br />
              우리는 그 아름다움을 찾아내어 세상에 전하는 것이 사명입니다."
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  )
}