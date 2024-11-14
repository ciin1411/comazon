import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { assert } from "superstruct";
import { CreateUser, PatchUser } from "./structs.js";

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

function asyncHandler(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      if (
        e.name === "StructError" ||
        e instanceof Prisma.PrismaClientValidationError
      ) {
        res.status(400).send({ message: e.message });
      } else if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        res.sendStatus(404);
      } else {
        res.status(500).send({ message: e.message });
      }
    }
  };
}

app.get(
  "/users",
  asyncHandler(async (req, res) => {
    /**
     * offset: 데이터를 몇개를 건너 뛸건지
     * limit : 한번에 조회할 데이터의 개수
     * limit과 offset를 활용하여 pagination을 구현할 수 있다.
     */
    const { offset = 0, limit = 10, order = "newest" } = req.query;
    let orderBy;
    switch (order) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
    }
    const users = await prisma.user.findMany({
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit),
    });
    res.send(users);
  })
);

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    // id에 해당하는 유저 조회
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
    });

    res.send(user);
  })
);

app.post(
  "/users",
  asyncHandler(async (req, res) => {
    // assert안에 확인하고자 하는 객체와 superstruct객체를 넣으면 됨
    assert(req.body, CreateUser);

    // 리퀘스트 바디 내용으로 유저 생성
    const user = await prisma.user.create({
      data: req.body,
    });
    res.status(201).send(user);
  })
);

app.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    assert(req.body, PatchUser);

    const { id } = req.params;
    // 리퀘스트 바디 내용으로 id에 해당하는 유저 수정
    const user = await prisma.user.update({
      // where 프로퍼티로 필터를 하고
      // data 프로퍼티로 데이터를 넘겨주면 된다.
      where: { id },
      data: req.body,
    });
    res.send(user);
  })
);

app.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    // id에 해당하는 유저 삭제
    await prisma.user.delete({ where: { id } });
    res.sendStatus(204);
  })
);

app.listen(process.env.PORT || 3000, () => console.log("Server Started"));
