import { ParticipantTest } from '@/components/tests/participant-test'

interface Props { params: Promise<{ publicToken: string }> }

export default async function PublicTestPage({ params }: Props) {
  const { publicToken } = await params
  return <ParticipantTest publicToken={publicToken} />
}
