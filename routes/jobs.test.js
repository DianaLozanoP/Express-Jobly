"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */
describe("POST /jobs", function () {
    const newJob = {
        title: "job4",
        salary: 150000,
        equity: 0.02,
        company_handle: "c2"
    }
    test("ok for admin only", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                title: "job4",
                salary: 150000,
                equity: "0.02",
                companyHandle: "c2"
            }
        });
    });
    test("unauthorized for logged in user but NOT ADMIN", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
        expect(resp.body).toEqual(
            { "error": { "message": "Must be admin to go acces this.", "status": 401 } }
        );
    });
    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "Microbiology Analyst",
                companyHandle: "c2"
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });

})

describe("GET", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j1",
                    salary: 110000,
                    equity: "0.1",
                    companyHandle: "c1"
                },
                {
                    title: "j2",
                    salary: 120000,
                    equity: "0.2",
                    companyHandle: "c2"
                },
                {
                    title: "j3",
                    salary: 130000,
                    equity: "0.3",
                    companyHandle: "c3"
                }
            ]
        })
    })
});

describe("PATCH /jobs/:id", function () {
    test("works for Admin Only", async function () {
        const job = await db.query(`
            SELECT * FROM jobs WHERE title ='j3'`)

        const resp = await request(app)
            .patch(`/jobs/${job.rows[0].id}`)
            .send({
                title: "Microbiology Analyst",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
            job: {
                title: "Microbiology Analyst",
                salary: 130000,
                equity: "0.3",
                companyHandle: "c3"
            },
        })
    })
    test("unauth for anon", async function () {
        const job = await db.query(`
            SELECT * FROM jobs WHERE title ='j3'`)
        const resp = await request(app)
            .patch(`/jobs/${job.rows[0].id}`)
            .send({
                title: "Microbiology Analyst",
            });
        expect(resp.statusCode).toEqual(401);
    });
    test("not found on no such company", async function () {
        const resp = await request(app)
            .patch(`/jobs/9999`)
            .send({
                title: "Microbiology Analyst",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });
    test("bad request on invalid data", async function () {
        const job = await db.query(`
            SELECT * FROM jobs WHERE title ='j3'`)
        const resp = await request(app)
            .patch(`/jobs/${job.rows[0].id}`)
            .send({
                salary: "NOT A NUMBER",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
    test("bad request on company handle change attempt", async function () {
        const job = await db.query(`
            SELECT * FROM jobs WHERE title ='j3'`)
        const resp = await request(app)
            .patch(`/jobs/${job.rows[0].id}`)
            .send({
                company_handle: "DIANA'S CUPCAKES",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
})

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for Admin Only", async function () {
        const job = await db.query(`
            SELECT * FROM jobs WHERE title ='j3'`)
        const resp = await request(app)
            .delete(`/jobs/${job.rows[0].id}`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({ deleted: `${job.rows[0].id}` });
    });

    test("unauth for anon", async function () {
        const job = await db.query(`
            SELECT * FROM jobs WHERE title ='j3'`)
        const resp = await request(app)
            .delete(`/jobs/${job.rows[0].id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/ companies / nope`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
