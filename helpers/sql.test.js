const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require("../expressError");


describe("sqlForPartialUpdate", function () {
    test("sending no data", function () {
        // Empty Objects
        const dataToUpdate = {};
        const jsToSql = {};

        // Act and Assert
        expect(function () {
            sqlForPartialUpdate(dataToUpdate, jsToSql);
        }).toThrow(BadRequestError);

        // Check custom error message
        expect(function () {
            sqlForPartialUpdate(dataToUpdate, jsToSql);
        }).toThrow("No data");
    });
})