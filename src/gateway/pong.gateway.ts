import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets/decorators";
import { OnModuleInit } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { Pong } from "./types";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class PongGateway implements OnModuleInit {
  players: { id: string; name: string }[] = [];
  pong: Pong;

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on("connection", (socket: Socket) => {
      this.server.emit("pong.members", this.players);

      socket.on("disconnecting", () => {
        this.players = this.players.filter((p) => p.id !== socket.id);
        this.server.emit("pong.members", this.players);
        if (this.players.length < 2) {
          this.pong = null;
        }
      });
    });

    setInterval(() => {
      if (this.players.length >= 2 && !this.pong) {
        this.pong = new Pong(600, 400, this.players[0], this.players[1]);
      }
      if (this.pong) {
        this.pong.update();
        this.server.emit("pong.cast", this.pong.show());
      }
    }, 15);
  }

  @SubscribeMessage("chat-message")
  chat(@ConnectedSocket() socket: Socket, @MessageBody() data: any) {
    const name = this.players.find((p) => p.id === socket.id)?.name;
    socket.broadcast.emit("chat-message", {
      message: data,
      name: data.name ?? "Annonymous",
    });
    console.log(`New message from ${socket.id}`, data);
  }

  @SubscribeMessage("pong.join")
  pongJoinMember(
    @ConnectedSocket() socket: Socket,
    @MessageBody() name: string
  ) {
    this.players.push({ id: socket.id, name });
    this.server.emit("pong.members", this.players);
  }

  @SubscribeMessage("pong.move")
  pongMove(@ConnectedSocket() socket: Socket, @MessageBody() key: string) {
    const player = this.pong && this.pong.player(socket.id);
    if (!player) {
      return;
    }
    switch (key) {
      case "ArrowUp": {
        player.move(-10);
        break;
      }
      case "ArrowDown": {
        player.move(10);
        break;
      }
      default: {
        player.move(0);
        break;
      }
    }
  }
}
