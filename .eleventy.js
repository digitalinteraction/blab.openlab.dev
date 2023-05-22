const escape = require('lodash.escape')
const eleventyRss = require('@11ty/eleventy-plugin-rss')
const { eleventyAlembic } = require('@openlab/alembic/11ty')
const { filesize } = require('filesize')
const ms = require('ms')

const site = require('./_data/podcast.json')

const longData = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeStyle: 'short',
})

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(eleventyRss)
  eleventyConfig.addPlugin(eleventyAlembic)
  eleventyConfig.addPassthroughCopy('assets')
  eleventyConfig.addFilter('xmlEscape', (input) => escape(input))
  eleventyConfig.addFilter('longData', (input) => longData.format(input))
  eleventyConfig.addFilter('filesize', (input) => filesize(input))
  eleventyConfig.addFilter('duration', (input) =>
    ms(input * 1000, { long: true })
  )
  eleventyConfig.addFilter('fullUrl', (input) =>
    new URL(input, site.url).toString()
  )
  eleventyConfig.addFilter('episodeSort', (collection) =>
    Array.from(collection).sort((a, b) => b.date.getTime() - a.date.getTime())
  )
}
