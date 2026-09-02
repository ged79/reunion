// 접속자 지역 조회 — Netlify 엣지가 IP로 추정한 지역명만 반환 (IP는 반환·저장하지 않음)
// 방문 통계(visits.region)용. 휴대폰 회선은 통신사 관문 위치로 잡힐 수 있어 참고용.
type NetlifyGeo = {
  city?: string
  country?: { code?: string; name?: string }
  subdivision?: { code?: string; name?: string }
}

export default (_request: Request, context: { geo?: NetlifyGeo }) => {
  const geo = context.geo || {}
  return Response.json(
    {
      country: geo.country?.name || null,
      subdivision: geo.subdivision?.name || null, // 도/광역시
      city: geo.city || null,
    },
    { headers: { 'cache-control': 'no-store' } },
  )
}

export const config = { path: '/geo' }
