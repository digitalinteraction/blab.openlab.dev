#!/usr/bin/env node

import 'dotenv/config'

import fs from 'node:fs/promises'
import crypto from 'node:crypto'

import Yaml from 'yaml'
import mp3Duration from 'mp3-duration'
import id3 from 'node-id3'
import Minio from 'minio'

const episodeMd = /^(\d+)\.md$/
const episodeMp3 = /^(\d+)\.mp3$/
const frontmatter = /^---([\s\S]*)---/m

const S3_BUCKET = 'openblab'
const CDN_URL = 'https://openblab.ams3.cdn.digitaloceanspaces.com'

const minio = new Minio.Client({
  endPoint: 'ams3.digitaloceanspaces.com',
  accessKey: process.env.S3_ACCESS_KEY,
  secretKey: process.env.S3_SECRET_KEY,
})

/** @param {string[]} input */
function getEpisodeNumbers(input) {
  return input.map((f) => episodeMd.exec(f)?.[1]).filter((f) => Boolean(f))
}

async function main() {
  // Loop through the episodes in episodes/
  const episodes = new Set(
    getEpisodeNumbers(await fs.readdir(new URL('../episodes', import.meta.url)))
  )

  // List contents of the bucket
  const objects = await new Promise((resolve, reject) => {
    const files = []
    const stream = minio.listObjectsV2(S3_BUCKET)
    stream.on('data', (object) => files.push(object))
    stream.on('end', () => resolve(files))
    stream.on('error', (e) => reject(error))
  })

  for (const object of objects) {
    const episode = episodeMp3.exec(object.name)?.[1]

    // Skip the file if it isn't an episode mp3 (e.g. "xxx.mp3") or if it already exists locally
    if (!episode || episodes.has(episode)) {
      console.debug('skip', object.name)
      continue
    }

    const cdnUrl = new URL(object.name, CDN_URL)

    // Check the S3 object was setup correctly by downloading from the CDN
    const res = await fetch(cdnUrl)
    if (!res.ok) throw new Error('Cannot download file, is it public?')
    const data = Buffer.from(await res.arrayBuffer())

    // Parse out the id3 tags
    const tags = id3.read(data)
    console.debug('found tags', tags)

    // Calculate the MP3 duration
    const duration = await mp3Duration(data)
    console.debug('duration', duration)

    // Generate frontmatter for the new episode
    const frontmatter = {
      guid: crypto.randomUUID(),
      title: tags.title || `${episode} - TODO title`,
      published: new Date(),
      permalink: `${episode}/index.html`,
      file: cdnUrl,
      length: data.byteLength,
      duration: duration,
      summary: tags.comment?.text ?? '',
      episodeNumber: parseInt(episode),
    }

    // Sketch out an empty markdown file
    const sections = [
      '---',
      Yaml.stringify(frontmatter).trim(),
      '---',
      frontmatter.summary,
    ]

    // Write the episodes to the "episodes/" folder
    await fs.writeFile(
      new URL(`../episodes/${episode}.md`, import.meta.url),
      sections.join('\n')
    )
  }
}

main().catch((error) => {
  console.error('Fatal error')
  console.error(error)
})
