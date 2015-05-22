/**
 * User: daletan
 * Date: 6/5/15
 * Time: 6:06 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

var isArray = require('lodash.isarray');
var moment = require('moment');
var isEmpty = require('lodash.isempty');
var remove = require('lodash.remove');

// no need for ORDER_ASC since we're only ever checking `desc`
var ORDER_DESC = 'desc';

module.exports = plugin;

/**
 * This groups collections into objects based on publishDate, modifiedDate, then date fields in YAML Front Matter (YFM)
 * @param options
 * @param {array|string} options.collections An array of collection types - anything that creates root-relative articles/posts or a single string (gets converted to array)
 * @param {array|string} options.dateFields metadata fields to check for on the file
 * @param {boolean} options.groupByMonth Group the posts by month? Otherwise grouped per year only, defaults to `true`
 * @param {string} options.listSortOrder Sort order for year, `asc` or `desc`, defaults to 'desc' (current year first)
 * @param {string} options.postSortOrder Sort order for individual posts, `asc` or `desc`, defaults to 'desc' (most recent post first)
 * @param {string} options.monthSortOrder Sort order for months, `asc` or `desc`, defaults to 'desc' (current month is first)
 * @param {string} options.locale moment.js locale value
 * @returns {Function}
 */
function plugin(options) {
    options = options || {};
    var collections     = options.collections || ['posts'];
    var dateFields      = options.dateFields || ['publishDate', 'modifiedDate', 'date'];
    var groupByMonth    = options.groupByMonth !== false;
    var listSortOrder   = options.listSortOrder || ORDER_DESC;
    var postSortOrder   = options.postSortOrder || ORDER_DESC;
    var monthSortOrder  = options.monthSortOrder || ORDER_DESC;
    var locale          = options.locale || '';

    if (typeof collections === 'string') {
        // if collections is a string, "convert" it to an array
        collections = [collections];
    }
    if (typeof dateFields === 'string') {
        // if dateFields is a string, "convert" it to an array
        dateFields = [dateFields];
    }

    if (!isArray(collections)) {
        throw new Error('options.collections must be an array');
    }
    if (!isArray(dateFields)) {
        throw new Error('options.dateFields must be an array');
    }

    var collectionsRegExpString = collections.join('|');
    var collectionsRegExp = new RegExp('^' + collectionsRegExpString);

    if (locale) {
        moment.locale(locale);
    }

    return function (files, metalsmith, done) {
        var metadata = metalsmith.metadata();
        var archive = {};
        Object.keys(files).forEach(function (key) {
            var valueFound = false;
            var file;
            var year;
            if (collectionsRegExp.test(key)) {
                file = files[key];
                dateFields.forEach(function (value) {
                    if (!valueFound && file[value]) {
                        // this will quit once the first instance is found
                        year = moment.utc(file[value]);
                        year = year.get('year');
                        if (!archive[year]) {
                            archive[year] = [];
                        }
                        // mainly used for testing
                        file.fileName = key;
                        archive[year].push(file);
                        valueFound = true;
                    } else {
                        valueFound = false;
                    }
                });
            }
        });

        // sort the posts first
        archive = sortArchivePosts(archive, dateFields, postSortOrder);
        // then sort the posts by year
        archive = sortArchiveYear(archive, listSortOrder);

        if (groupByMonth) {
            // sort the posts per year/month
            archive = sortArchiveMonth(archive, dateFields, monthSortOrder);
        }

        // create the archive metadata
        metadata.archive = archive;
        done();
    }
}

/**
 *
 * @param {object} archiveList
 * @param {array} dateFields
 */
function sortArchiveMonth(archiveList, dateFields, order) {
    var localeMonths = moment.months();
    archiveList.forEach(function (list) {
        var monthData = {};
        if (!list.months) {
            // create an array with 12 indexes in it
            // remove empties later
            list.months = new Array(12);
        }
        if (list.data) {
            list.data.forEach(function (post) {
                var date;
                var monthIndex;
                var monthName;
                dateFields.forEach(function (field) {
                    // find the first `field` property on the post metadata
                    if (!date && post[field]) {
                        date = post[field];
                    }
                });
                if (date) {
                    // create a new moment date object
                    // since this is utc, the timezone could actually
                    // bump your date up one day
                    date = moment.utc(date);
                    monthIndex = date.get('month');

                    // get the month this post is in, we don't care about timezone
                    monthName = localeMonths[monthIndex];
                    if (!monthData[monthName]) {
                        // create a hash of the actual month name
                        // `data` is an array of objects for the posts
                        // `index` is the Date index of a month used to splice into the `list.months` array
                        monthData[monthName] = {
                            data: [],
                            index: monthIndex
                        };
                    }
                    monthData[monthName].data.push(post);
                }
            });
        }
        if (!isEmpty(monthData)) {
            Object.keys(monthData).forEach(function (key) {
                var monthInfo = monthData[key];
                var data = {
                    name: key,
                    data: monthInfo.data
                };
                // insert the month data into the index of the month array
                list.months.splice(monthInfo.index, 1, data);
            });
            // remove undefined entries
            list.months = remove(list.months);
            if (order === ORDER_DESC) {
                list.months = list.months.reverse();
            }
        }
    });

    return archiveList;
}

/**
 * Sort the archive by year. This creates an array to preserve order
 * @param {object} archiveList
 * @param {string} order
 * @returns {Array}
 */
function sortArchiveYear(archiveList, order) {
    var ret = [];
    Object.keys(archiveList).forEach(function (key) {
        ret.push({
            year: key,
            data: archiveList[key]
        });
    });

    ret.sort(function (a, b) {
        if (order === ORDER_DESC) {
            return b.year - a.year
        }
        return a.year - b.year;
    });

    return ret;
}

/**
 *
 * @param {object} archive The archive list
 * @param {array} dateFields @see options.dateFields
 * @param {string} sortOrder 'desc' or 'asc', defaults to 'desc'
 */
function sortArchivePosts(archive, dateFields, sortOrder) {
    Object.keys(archive).forEach(function (year) {
        var posts = archive[year];
        posts.sort(function (a, b) {
            var aDate;
            var bDate;
            dateFields.forEach(function (field) {
                // check each `post` to see if the `field`
                // property is in the post metadata/YFM
                if (!aDate && a[field]) {
                    aDate = a[field];
                }
                if (!bDate && b[field]) {
                    bDate = b[field];
                }
            });
            aDate = new Date(aDate);
            bDate = new Date(bDate);
            if (sortOrder === ORDER_DESC) {
                return bDate - aDate;
            }
            // asc
            return aDate - bDate;

        });
    });

    return archive;
}
