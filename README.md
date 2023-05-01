# blab.openlab.dev

This the the repo for the Open Lab podcast "Open Blab". It contains the source code to generate the website and links to the podcast media which is hosted in an S3 bucket.
The site is built with [eleventy](https://www.11ty.dev/), is styled with [alembic.openlab.dev](https://alembic.openlab.dev/) and pulls fonts from [fonts.openlab.dev](https://fonts.openlab.dev/).

Eleventy builds the site and generates the RSS feed for the podcast based on the markdown files in this repo.
There are some `scripts/` to help with managing the content.
The site is build and deployed using GitHub pages when there is a new commit pushed to `main`.

The RSS feed is registered with [Apple Podcasts Connect](https://podcastsconnect.apple.com/)
and [Spotify Podcasts](https://podcasters.spotify.com).

## development

```sh
# checkout the repo and cd/to/the/folder

# install npm dependencies
npm install

# build the site, watch for changes and host it at http://localhost:8080
npm run start

# build the site once
npm run build
```
