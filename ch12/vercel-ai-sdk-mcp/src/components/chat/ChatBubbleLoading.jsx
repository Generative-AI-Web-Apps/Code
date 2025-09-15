import { Card } from '@/components/ui/card';

const ChatBubbleLoading = () => {
  return (
    <Card className="p-5 flex items-center gap-3 justify-center w-fit max-w-[75%] border-none">
      <p className="font-semibold">Please 🙏 Wait...</p>
    </Card>
  );
};

export default ChatBubbleLoading;
