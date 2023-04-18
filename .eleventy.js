const escape = require('lodash.escape')
const eleventyRss = require('@11ty/eleventy-plugin-rss')
const { eleventyAlembic } = require('@openlab/alembic/11ty')
const { filesize } = require('filesize')
const ms = require('ms')

const longData = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeStyle: 'short',
})

const duration = new Intl.RelativeTimeFormat('en-GB', {
  style: 'long',
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
}
