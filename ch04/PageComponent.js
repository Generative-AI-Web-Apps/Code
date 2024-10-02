"use client";

export default function Page() {
  const [component, setComponent] = useState();
  const handleInputChange = (event) => {
    setInput(event.target.value);
  };
  const [input, setInput] = useState("");
  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const value = input.trim();

          setInput("");

          if (!value) return;
          setComponent(await streamComponent(value, []));
        }}
      >
        <TextArea value={input} onChange={handleInputChange} />
      </form>

      <div>{component}</div>
    </div>
  );
}
