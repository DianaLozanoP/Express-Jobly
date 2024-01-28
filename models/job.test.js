const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", function () {
    const newJob = {
        title: "newJob",
        salary: 123000,
        equity: 0.123,
        company_handle: "c1"
    }
    test("Works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(
            {
                title: "newJob",
                salary: 123000,
                equity: "0.123",
                companyHandle: "c1"
            }
        );
        const result = await db.query(
            `SELECT title, salary, equity, company_handle
                 FROM jobs
                 WHERE title = 'newJob'`);
        expect(result.rows).toEqual([
            {
                title: "newJob",
                salary: 123000,
                equity: "0.123",
                company_handle: "c1"
            },
        ]);
    })
})

describe("findAll", function () {
    test("Works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                "companyHandle": "c1",
                "equity": "0.1",
                "salary": 100000,
                "title": "j1",
            },
            {
                "companyHandle": "c2",
                "equity": "0.2",
                "salary": 110000,
                "title": "j2",
            },
            {
                "companyHandle": "c3",
                "equity": "0.3",
                "salary": 150000,
                "title": "j3",
            },
        ])
    })
})

describe("update", function () {
    const updateData = {
        title: "newTitle",
        salary: 456000,
        equity: 0.12
    }
    test("it updates info", async function () {
        const result = await db.query(
            `SELECT id, title
                 FROM jobs
                 WHERE title ='j2'`);

        const job = await Job.update(`${result.rows[0].id}`, updateData)
        expect(job).toEqual({
            title: "newTitle",
            equity: "0.12",
            salary: 456000,
            companyHandle: "c2"
        });
    })
})

describe("delete", function () {
    test("deleted", async function () {
        const result = await db.query(
            `SELECT id, title
                 FROM jobs
                 WHERE title ='j2'`);
        const jobId = result.rows[0].id
        await Job.remove(jobId);
        const res = await db.query(
            `SELECT id FROM jobs 
            WHERE id=${jobId}`)
        expect(res.rows.length).toEqual(0);
    })
})


