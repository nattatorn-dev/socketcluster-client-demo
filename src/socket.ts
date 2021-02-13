import Logger from "bunyan";
import * as socketClusterClient from "socketcluster-client";

export interface IConnectionOptions
  extends socketClusterClient.AGClientSocket.ClientOptions {}

export interface ISocketEvent<T = any> {
  type: string;
  data: T;
}

export class SocketClient {
  private socket!: socketClusterClient.AGClientSocket;

  constructor(private options: IConnectionOptions, private logger: Logger) {}

  public create() {
    if (this.socket) {
      return;
    }

    this.socket = socketClusterClient.create({
      hostname: this.options.hostname,
      port: this.options.port,
    });
  }

  public async connect() {
    this.create();

    this.handleOnConnecting();
    this.handleOnConnected();
    this.handleOnError();
  }

  public publish<T>(channelName: string, data: T) {
    this.connect();
    const channel = this.socket.channel(channelName);
    return channel.transmitPublish(data);
  }

  public async subscribe<T>(
    channelName: string,
    onMessage: (data: T, socketEvent: ISocketEvent<T>) => Promise<void>,
  ) {
    this.create();

    const channel = this.socket.subscribe(channelName);

    for await (const socketEvent of channel) {
      await onMessage(socketEvent.data, socketEvent);
    }
  }

  public async unsubscribe(channelName: string) {
    return this.socket.unsubscribe(channelName);
  }

  private async handleOnConnecting() {
    for await (const result of this.socket.listener("connecting")) {
      this.logger.info(
        { event: "socketcluster_connecting", result },
        `Socket Cluster is connecting`,
      );
    }
  }

  private async handleOnConnected() {
    for await (const { id } of this.socket.listener("connect")) {
      this.logger.info(
        { event: "socketcluster_connected", id },
        `Successfully to connected Socket Cluster`,
      );
    }
  }

  private async handleOnError() {
    for await (const error of this.socket.listener("error")) {
      this.logger.error(error, { event: "socketcluster_error" });
    }
  }
}
