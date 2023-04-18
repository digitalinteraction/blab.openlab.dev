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

/** @param {string} input */
function parseFrontmatter(input) {
  const match = frontmatter.exec(input)
  if (!match) throw new Error('Invalid episode')
  return Yaml.parse(match[1])
}

async function main() {
  // Loop through the episodes in episodes/
  const episodes = getEpisodeNumbers(
    await fs.readdir(new URL('../episodes', import.meta.url))
  )
  const existing = new Set(episodes)

  // console.debug('Found', episodes)

  // for (const episodeNumber of episodes) {
  //   console.debug('Processing', episodeNumber)
  //   const contents = await fs.readFile(
  //     new URL(`../episodes/${episodeNumber}.md`, import.meta.url),
  //     'utf8'
  //   )

  //   // Parse the frontmatter
  //   const frontmatter = parseFrontmatter(contents)
  //   console.debug('frontmatter %O', frontmatter)

  //   // Download the file
  //   const fileRes = await fetch(frontmatter.file)
  //   if (!fileRes.ok) throw new Error('Invalid mp3 file')
  //   const data = await fileRes.arrayBuffer()
  //   const tags = id3.read(Buffer.from(data))
  //   console.debug('tags %O', tags)

  //   // Get the duration + filesize
  //   //
  //   // Generate a UUID if missing
  // }

  //
  // ---
  //
  // List contents of the bucket
  const objects = await new Promise((resolve, reject) => {
    const files = []
    const stream = minio.listObjectsV2(S3_BUCKET)
    stream.on('data', (object) => files.push(object))
    stream.on('end', () => resolve(files))
    stream.on('error', (e) => reject(error))
  })
  for (const object of objects) {
    // Find files /\d+.mp3/
    const episode = episodeMp3.exec(object.name)?.[1]
    if (!episode || existing.has(episode)) {
      console.debug('skip', object.name)
      continue
    }

    const cdnUrl = new URL(object.name, CDN_URL)

    const res = await fetch(cdnUrl)
    if (!res.ok) throw new Error('Cannot download file')
    const data = Buffer.from(await res.arrayBuffer())
    const tags = id3.read(data)

    console.debug('found tags', tags)

    const duration = await mp3Duration(data)
    console.debug('duration', duration)

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

    const file = ['---', Yaml.stringify(frontmatter).trim(), '---', ''].join(
      '\n'
    )

    await fs.writeFile(
      new URL(`../episodes/${episode}.md`, import.meta.url),
      file
    )

    //
    //
    // Create episode/{number}.md for missing mp3 files
    // draft=true
    // fill in duration + filesize + generate a guid + file
  }
}

main().catch((error) => {
  console.error('Fatal error')
  console.error(error)
})
