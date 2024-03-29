"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);
    const jobs = await db.query(`
      SELECT id, title, salary, equity
      FROM jobs
      WHERE company_handle =$1`, [handle])
    const company = companyRes.rows[0];
    company.jobs = jobs.rows

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }


  //Given a string filter all companies containing that string in their names.
  //It is case insensitive, the string is lower-cased.
  // returns [ {"handle": "arnold-berger-townsend",
  // "name": "Arnold, Berger and Townsend",
  // "description": "Kind crime at perhaps beat. Enjoy deal purpose serve begin or thought. Congress everything miss tend."}, {}]
  static async filter(nameLike, minEmployees, maxEmployees) {
    let nameLC = ''
    if (nameLike) {
      nameLC = `%${nameLike.toLowerCase()}%`
    }
    if (nameLike && minEmployees && maxEmployees) {
      const companiesFilter = await db.query(`
        SELECT handle,
                name,
                description, 
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
              FROM companies
              WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3`,
        [nameLC, minEmployees, maxEmployees]);
      const companies = companiesFilter.rows;
      if (companies.length === 0) throw new NotFoundError('No companies found based on the filtered criteria');
      return companies;
    }
    else if (!minEmployees && !maxEmployees) {
      const companiesFilter = await db.query(`
        SELECT handle,
                name,
                description, 
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
              FROM companies
              WHERE name ILIKE $1`,
        [nameLC]);
      const companies = companiesFilter.rows;
      if (companies.length === 0) throw new NotFoundError('No companies found based on the filtered criteria');
      return companies;
    }
    else if (!nameLike && !minEmployees) {
      const companiesFilter = await db.query(`
      SELECT handle,
              name,
              description, 
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
            FROM companies
            WHERE num_employees <= $1`,
        [maxEmployees]);
      const companies = companiesFilter.rows;
      if (companies.length === 0) throw new NotFoundError('No companies found based on the filtered criteria');
      return companies;
    }
    else if (!nameLike && !maxEmployees) {
      const companiesFilter = await db.query(`
      SELECT handle,
              name,
              description, 
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
            FROM companies
            WHERE num_employees >= $1`,
        [minEmployees]);
      const companies = companiesFilter.rows;
      if (companies.length === 0) throw new NotFoundError('No companies found based on the filtered criteria');
      return companies;
    }
    //filter if no name provided
    else if (!nameLike) {
      const companiesFilter = await db.query(`
      SELECT handle,
              name,
              description, 
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
            FROM companies
            WHERE num_employees >= $1 AND num_employees <= $2`,
        [minEmployees, maxEmployees]);
      const companies = companiesFilter.rows;
      if (companies.length === 0) throw new NotFoundError('No companies found based on the filtered criteria');
      return companies;
    }
    //filter if not minimum nnumber of emploeers provided
    else if (!minEmployees) {
      const companiesFilter = await db.query(`
      SELECT handle,
              name,
              description, 
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
            FROM companies
            WHERE name ILIKE $1 AND num_employees <= $2`,
        [nameLC, maxEmployees]);
      const companies = companiesFilter.rows;
      if (companies.length === 0) throw new NotFoundError('No companies found based on the filtered criteria');
      return companies;
    }
    //filter if not maximum number of emploeers provided
    else if (!maxEmployees) {
      const companiesFilter = await db.query(`
      SELECT handle,
              name,
              description, 
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
            FROM companies
            WHERE name LIKE $1 AND num_employees >= $2`,
        [nameLC, minEmployees]);
      const companies = companiesFilter.rows;
      if (companies.length === 0) throw new NotFoundError('No companies found based on the filtered criteria');
      return companies;
    }
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
