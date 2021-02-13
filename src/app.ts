import bunyan from "bunyan";
import { IConnectionOptions, SocketClient } from "./socket";

interface IMessage {
  key: string;
  data: Record<string, unknown>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const logger = bunyan.createLogger({ name: "socket-cluster-demo" });

const connectionOptions: IConnectionOptions = {
  hostname: "localhost",
  port: 8000,
};

async function publisher() {
  const socket = new SocketClient(connectionOptions, logger);

  for (let index = 0; index < 10000; index++) {
    socket.publish<IMessage>("channel1", {
      key: index.toString(),
      data: { message: "hello" },
    });

    logger.info("pubished", index);
    await sleep(1000);
  }
}

async function subscriber() {
  const socket = new SocketClient(connectionOptions, logger);
  socket.subscribe<IMessage>("channel1", async (data, event) => {
    logger.info("data", data);
    logger.info("event", event);
  });
}

publisher();
subscriber();
