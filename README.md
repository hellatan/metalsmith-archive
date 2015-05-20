[moment]: http://momentjs.com/docs/#/i18n/
# Metalsmith Archive [![Build Status](https://travis-ci.org/hellatan/metalsmith-archive.svg)](https://travis-ci.org/hellatan/metalsmith-archive)
 
Create archive metadata for all your posts

## Installation

```bash
npm install --save-dev metalsmith-archive
```

## Usage

JavaScript API:

```js
var Metalsmith = require('metalsmith');
var archive = require('metalsmith-archive');

Metalsmith()
    .use(archive());
```

## Options

### collections

The folder your posts live in. Defaults to `"posts"`

### dateFields

The fields to search through froup grouping. Defaults to `['publishDate', 'modifiedDate', 'date']`. The first field found is considered the date to group it in

### groupByMonth

Group your posts by month? Defaults to `true`. Pass in `false` to disable this functionality.

### listSortOrder

Sort years `asc` or `desc`. Defaults to `desc`

### monthSortOrder

Sort months `asc` or `desc`. Defaults to `desc`

### postSortOrder

Sort posts `asc` or `desc`. Defaults to `desc`

### locale

The language locale to use. This affects the months being returned. Accepts any valid [moment][moment] locale

## Notes
 
The metalsmith cli workflow has not been tested

  
