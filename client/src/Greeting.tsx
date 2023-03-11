import { useState } from "react";
import { trpc } from "./utils/trpc";

export function Greeting() {
  const [num, setNumber] = useState(0);

  const greeting = trpc.greeting.useQuery({ name: "tRPC user" });
  trpc.randomNumber.useSubscription(undefined, {
    onData({ randomNumber }) {
      setNumber(randomNumber);
    },
  });

  return (
    <div>
      {greeting.data?.text}
      <div>{num}</div>
    </div>
  );
}
