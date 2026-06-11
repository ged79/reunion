import { redirect } from 'next/navigation'

export default function EventsPage({ params }: { params: { branch: string } }) {
  redirect(`/${params.branch}/updates`)
}
