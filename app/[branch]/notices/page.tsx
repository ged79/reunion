import { redirect } from 'next/navigation'

export default function NoticesPage({ params }: { params: { branch: string } }) {
  redirect(`/${params.branch}/updates`)
}
