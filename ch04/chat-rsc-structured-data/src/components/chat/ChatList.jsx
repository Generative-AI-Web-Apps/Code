import ChatBubble from './ChatBubble';
import ChatBubbleLoading from './ChatBubbleLoading';

const ChatList = ({ messages, isLoading }) => {
  return (
    <ul className="flex flex-col gap-5">
      {messages.map((item, index) => (
        <li key={index}>
          {item.role === 'user' ? (
            <ChatBubble role="user" text={item.content} className={`ml-auto border-none`} />
          ) : (
            <div className="bg-gray-100 rounded-lg p-4 max-w-3xl">
              <p className="font-bold mb-2">Assistant: Here are some products related to your query:</p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Description</th>
                    <th className="border p-2">Price</th>
                    <th className="border p-2">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {item.products.map((product, productIndex) => (
                    <tr key={productIndex} className="border-b">
                      <td className="border p-2">{product.name}</td>
                      <td className="border p-2">{product.description}</td>
                      <td className="border p-2">${product.price.toFixed(2)}</td>
                      <td className="border p-2">{product.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </li>
      ))}
      {isLoading ? (
        <li key={messages.length + 1}>
          <ChatBubbleLoading />
        </li>
      ) : null}
    </ul>
  );
};

export default ChatList;