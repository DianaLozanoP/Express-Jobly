const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    /**Create a new job. 
     * Data should be {title, salary, equity, company_handle}
     * Returns {title, salary, equity, company_handle}
     */
    static async create({ title, salary, equity, company_handle }) {
        const result = await db.query(`
        INSERT INTO jobs  
        (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING title, salary, equity, company_handle AS "companyHandle" `,
            [title, salary, equity, company_handle]);
        const job = result.rows[0];
        return job;
    }
    static async findAll() {
        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
                 FROM jobs
                 ORDER BY title`);
        return result.rows;
    }

    // Update job data with `data`.
    /*
    /* This is a "partial update" --- it's fine if data doesn't contain all the
    /* fields; this only changes provided ones.
    /*
    /* Data can include: {title, salary, equity}
    /*
    /* Returns {title, salary, equity, company_handle AS "companyHandle"}
    /*
    /* Throws NotFoundError if not found.
    /*/
    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                title: "title",
                salary: "salary",
                equity: "equity"
            });
        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${id} 
                      RETURNING title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values]);
        const job = result.rows[0];
        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given company from database; returns undefined.
    *
    * Throws NotFoundError if company not found.
    **/
    static async remove(id) {
        const result = await db.query(
            `DELETE
                 FROM jobs
                 WHERE id = $1
                 RETURNING title`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;