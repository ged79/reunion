import { redirect } from 'next/navigation'

export default function NewsPage({ params }: { params: { branch: string } }) {
  redirect(`/${params.branch}/updates`)
}
