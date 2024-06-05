import { Card } from '@/components/ui/card';

const ChatMessage = ({ role, text, className = '', width = 'w-fit max-w-md', ...rest }) => {
  return (
    <Card className={`p-5 flex flex-col gap-3 text-wrap break- border-none whitespace-pre-wrap ${width} ${className}`}>
      <h5 className="text-lg font-semibold">{role === 'assistant' ? `✴️ Astra` : `👤 ${role}`}</h5>
      <p>{text}</p>
    </Card>
  );
};

export default ChatMessage;
