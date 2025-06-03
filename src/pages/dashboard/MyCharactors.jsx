import { useState, useEffect } from "react";

export default function MyCharacters() {
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    const dummyData = [
      {
        // character info
        name: "그만보여줘",
        job: "브레이커",
        level: 1730,
        daily: {
          epona: false,
          guardian: true,
          restGauge: 100,
        },
        weekly: {
          raid: [{ name: "일리아칸", type: "하드", gate: [true, false, true], gold: 3000 }],
        },
        imageUrl:
          "https://img.lostark.co.kr/armory/2/CEDF19D720D5E90328939C6B98B1DC4784369F2559851CDC75F16270887F9F0A.jpg?v=20250528032430",
      },
      // 다른 캐릭터들...
    ];
    setCharacters(dummyData);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {characters.map((char, i) => (
        <div key={i} className="bg-white rounded-xl shadow p-4">
          <img
            src={char.imageUrl}
            alt={char.name}
            className="w-full h-40 object-cover rounded-md mb-2"
          />
          <h3 className="text-lg font-bold">@카마인 {char.name}</h3>
          <p className="text-sm text-gray-600">
            Lv. {char.level} / {char.job}
          </p>

          <div className="mt-2">
            <p className="font-semibold text-sm">일일 숙제</p>
            <ul className="text-xs text-gray-700">
              <li>에포나: {char.daily.epona ? "✅" : "❌"}</li>
              <li>가디언 토벌: {char.daily.guardian ? "✅" : "❌"}</li>
              <li>휴식 게이지: {char.daily.restGauge}</li>
            </ul>
          </div>

          <div className="mt-2">
            <p className="font-semibold text-sm">주간 레이드</p>
            <ul className="text-xs text-gray-700">
              {char.weekly.raid.map((r, idx) => (
                <li key={idx}>
                  {r.name} ({r.type}) -{" "}
                  {r.gate.map((g, i) => (g ? `관${i + 1}✅ ` : `관${i + 1}❌ `)).join("")} |{" "}
                  {r.gold}G
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
