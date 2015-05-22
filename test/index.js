/**
 * User: daletan
 * Date: 6/8/15
 * Time: 7:04 PM
 * Copyright 1stdibs.com, Inc. 2015. All Rights Reserved.
 */

'use strict';

var assert = require('assert');
var Metalsmith = require('metalsmith');
var archive = require('..');
var isArray = require('lodash.isarray');
var moment = require('moment');

describe('metalsmith archive groupings', function () {
    var M;
    beforeEach(function () {
        M = Metalsmith('test/fixtures');
    });
    it('should create archive metadata', function (done) {
        M.use(archive())
            .build(function (err) {
                if (err) {
                    return done(err);
                }
                var metadata = M.metadata();
                var archive = metadata.archive;
                var years = ['2015', '2014'];
                assert.ok(archive);
                assert.ok(archive.length === 2);
                archive.forEach(function (data, index) {
                    var year = years[index];
                    assert.equal(data.year, year);
                });
                done();
            });
    });
    it('should build an archive from a specific folder', function (done) {
        M.use(archive({
                collections: 'rando'
            }))
            .build(function (err) {
                if (err) {
                    return done(err);
                }
                var metadata = M.metadata();
                var archive = metadata.archive;
                var years = ['2015', '2014'];
                archive.forEach(function (posts, index) {
                    var year = years[index];
                    assert.equal(posts.year, year);
                    posts.data.forEach(function (post) {
                        assert.ok(/^rando\//.test(post.fileName));
                    });
                });
                done();
            });
    });
    it('should sort the archive by year/month combo', function (done) {
        M.use(archive({
                groupByMonth: true
            }))
            .build(function (err) {
                if (err) {
                    return done(err);
                }
                var metadata = M.metadata();
                var archive = metadata.archive;
                archive.forEach(function (archiveYear) {
                    assert.ok(isArray(archiveYear.months));
                    archiveYear.months.forEach(function (month) {
                        assert.ok(typeof month.name === 'string' && month.name !== 'undefined');
                        assert.ok(isArray(month.data));
                        assert.ok(month.data.length > 0);
                    });
                });
                done();
            });
    });
    it('should not go to the previous year', function (done) {
        M.use(archive({
                groupByMonth: true,
                collections: 'year'
            }))
            .build(function (err) {
                if (err) {
                    return done(err);
                }
                var metadata = M.metadata();
                var archive = metadata.archive;
                archive.forEach(function (archiveYear) {
                    assert.ok(isArray(archiveYear.months));
                    assert.ok(archiveYear.year === '2016');
                    archiveYear.months.forEach(function (month) {
                        var data = month.data;
                        assert.equal(month.name, 'January');
                        assert.ok(isArray(data));
                        assert.ok(data.length > 0);
                        assert.ok(moment.utc(data[0].publishDate).format('MMMM D, YYYY') === 'January 1, 2016');
                    });
                });
                done();
            });
    });
    describe('asc sort order', function () {
        it('should sort posts earliest to latest', function (done) {
            M.use(archive({
                    listSortOrder: 'asc',
                    collection: 'posts'
                }))
                .build(function (err) {
                    if (err) {
                        return done(err);
                    }
                    var metadata = M.metadata();
                    var archive = metadata.archive;
                    assert.equal(archive[0].year, '2014');
                    assert.equal(archive[1].year, '2015');
                    done();
                });
        });
    });
});
