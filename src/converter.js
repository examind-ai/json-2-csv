'use strict';

let json2Csv = require('./json-2-csv'), // Require our json-2-csv code
    csv2Json = require('./csv-2-json'), // Require our csv-2-json code
    constants = require('./constants.json'), // Require in constants
    docPath = require('doc-path'),
    promise = require('bluebird'),
    _ = require('underscore');

module.exports = {
    json2csv : json2csv,
    csv2json : csv2json,
    json2csvPromisified :  promise.promisify(json2csv),
    csv2jsonPromisified : promise.promisify(csv2json)
};

/**
 * Default options
 */
let defaultOptions = constants.DefaultOptions;

function isDefined(val) {
    return !_.isUndefined(val);
}

function copyOption(options, lowercasePath, uppercasePath) {
    let lowerCaseValue = docPath.evaluatePath(options, lowercasePath);
    if (isDefined(lowerCaseValue)) {
        docPath.setPath(options, uppercasePath, lowerCaseValue);
    }
}

/**
 * Build the options to be passed to the appropriate function
 * If a user does not provide custom options, then we use our default
 * If options are provided, then we set each valid key that was passed
 */
function buildOptions(opts, cb) {
    // PREVIOUS VERSION SUPPORT (so that future versions are backwards compatible)
    // Issue #26: opts.EOL should be opts.DELIMITER.EOL -- this will move the option & provide backwards compatibility
    if (docPath.evaluatePath(opts, 'EOL')) { docPath.setPath(opts, 'DELIMITER.EOL', opts.EOL); }

    // #62: Allow for lower case option names
    if (opts) {
        copyOption(opts, 'prependHeader', 'PREPEND_HEADER');
        copyOption(opts, 'trimHeaderFields', 'TRIM_HEADER_FIELDS');
        copyOption(opts, 'trimFieldValues', 'TRIM_FIELD_VALUES');
        copyOption(opts, 'sortHeader', 'SORT_HEADER');
        copyOption(opts, 'parseCsvNumbers', 'PARSE_CSV_NUMBERS');
        copyOption(opts, 'keys', 'KEYS');
        copyOption(opts, 'checkSchemaDifferences', 'CHECK_SCHEMA_DIFFERENCES');
        copyOption(opts, 'emptyFieldValue', 'EMPTY_FIELD_VALUE');
        if (isDefined(opts.delimiter)) {
            copyOption(opts, 'delimiter.field', 'DELIMITER.FIELD');
            copyOption(opts, 'delimiter.array', 'DELIMITER.ARRAY');
            copyOption(opts, 'delimiter.wrap', 'DELIMITER.WRAP');
            copyOption(opts, 'delimiter.eol', 'DELIMITER.EOL');
        }
    }

    opts = _.defaults(opts || {}, defaultOptions);

    // Note: _.defaults does a shallow default, we need to deep copy the DELIMITER object
    opts.DELIMITER = _.defaults(opts.DELIMITER || {}, defaultOptions.DELIMITER);

    // If the delimiter fields are the same, report an error to the caller
    if (opts.DELIMITER.FIELD === opts.DELIMITER.ARRAY) { return cb(new Error(constants.Errors.delimitersMustDiffer)); }

    // Otherwise, send the options back
    return cb(null, opts);
}

/**
 * Client accessible json2csv function
 * Takes an array of JSON documents to be converted, a callback that will be called with (err, csv)
 * after processing is complete, and optional options
 * @param array Object[] data to be converted
 * @param callback Function callback
 * @param opts Object options object
 */
function json2csv(array, callback, opts) {
    // If this was promisified (callback and opts are swapped) then fix the argument order.
    if (_.isObject(callback) && !_.isFunction(callback)) {
        let func = opts;
        opts = callback;
        callback = func;
    }

    buildOptions(opts, function (err, options) { // Build the options
        if (err) {
            return callback(err);
        } else {
            json2Csv.json2csv(options, array, callback); // Call our internal json2csv function
        }
    });
}


/**
 * Client accessible csv2json function
 * Takes a string of CSV to be converted to a JSON document array, a callback that will be called
 * with (err, json) after processing is complete, and optional options
 * @param csv
 * @param callback
 * @param opts
 */
function csv2json(csv, callback, opts) {
    // If this was promisified (callback and opts are swapped) then fix the argument order.
    if (_.isObject(callback) && !_.isFunction(callback)) {
        let func = opts;
        opts = callback;
        callback = func;
    }

    buildOptions(opts, function (err, options) { // Build the options
        if (err) {
            return callback(err);
        } else {
            csv2Json.csv2json(options, csv, callback); // Call our internal csv2json function
        }
    });
}