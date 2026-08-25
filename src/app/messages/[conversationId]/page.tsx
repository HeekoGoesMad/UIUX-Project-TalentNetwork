import MessagesPage from "@/app/messages/page";

export default async function ConversationMessagesPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  return <MessagesPage conversationId={conversationId} />;
}
