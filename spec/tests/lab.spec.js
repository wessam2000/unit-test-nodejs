const request = require("supertest");
const app = require("../..");
const { clearDatabase } = require("../../db.connection");

const req = request(app);

fdescribe("lab testing:", () => {
  let mockUser;
  let mockTodo;

  beforeAll(async () => {
    mockUser = {
      name: "Wessam",
      email: "Wessam@gmail.com",
      password: "1234pass",
    };
    await req.post("/user/signup").send(mockUser);
    let res = await req.post("/user/login").send(mockUser);
    userToken = res.body.data;
  });

  afterAll(async () => {
    await clearDatabase();
  });

  describe("users routes:", () => {
    it("req to get(/user/search) ,expect to get the correct user with his name", async () => {
      //anther way
      // let res = await req.get("/user/search").query({ name: mockUser.name });
      let res = await req.get("/user/search?name=" + mockUser.name);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(mockUser.name);
    });
    it("req to get(/user/search) with invalid name ,expect res status and res message to be as expected", async () => {
      let res = await req.get("/user/search").query({ name: "Ali" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("There is no user with name: Ali");
    });
  });

  describe("todos routes:", () => {
    beforeAll(async () => {
      mockTodo = {
        title: "finish lab",
        description: "making unit tests for node",
        userId: mockUser._id,
      };
      let res = await req
        .post("/todo")
        .send(mockTodo)
        .set({ authorization: userToken });
      // console.log(res.body);

      mockTodo._id = res.body.data._id;
    });

    it("req to patch(/todo/) with id only, expect res status and message to be as expected", async () => {
      let res = await req
        .patch(`/todo/${mockTodo._id}`)
        .send({})
        .set({ authorization: userToken });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain(
        "must provide title and id to edit todo"
      );
    });

    it("req to patch(/todo/) with id and title, expect res status and updated todo", async () => {
      let updatedTitle = "Updated Todo Title";
      let res = await req
        .patch(`/todo/${mockTodo._id}`)
        .send({ title: updatedTitle })
        .set({ authorization: userToken });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(updatedTitle);
    });

    it("req to get(/todo/user), expect to get all user's todos", async () => {
      let res = await req
        .get(`/todo/user`)
        .query({ userId: mockUser._id })
        .set({ authorization: userToken });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveSize(1);
    });

    it("req to get(/todo/user), expect not to get any todos for user with no todos", async () => {
      let anotherUser = {
        name: "nour",
        email: "nour@gmail.com",
        password: "5678pass",
      };
      await req.post("/user/signup").send(anotherUser);
      let resLogin = await req.post("/user/login").send(anotherUser);
      let anotherUserToken = resLogin.body.data;
      // console.log("anotherUserToken",anotherUserToken.body.data);
      let res = await req
        .get(`/todo/user`)
        .query({ email: anotherUser.email })
        .set({ authorization: anotherUserToken });
      expect(res.status).toBe(200);
      console.log("res.body.data", res.body.message);

      expect(res.body.message).toContain("Couldn't find any todos for");
    });
  });
});
