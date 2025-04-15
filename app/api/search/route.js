export async function GET(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify({ error: "검색어가 필요합니다" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
        query
      )}&display=5&start=1&sort=random`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET,
        },
      }
    );

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API 요청 오류:", error);
    return new Response(JSON.stringify({ error: "API 요청 실패" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
