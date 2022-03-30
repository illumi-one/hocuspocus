import test from 'ava'
import { onRequestPayload } from '@hocuspocus/server'
import fetch from 'node-fetch'
import { newHocuspocus } from '../utils'

test('executes the onRequest callback', async t => {
  await new Promise(resolve => {
    const server = newHocuspocus({
      async onListen() {
        await fetch(`${server.httpURL}/foobar`)
      },
      async onRequest({ request }: onRequestPayload) {
        t.is(request.url, '/foobar')

        resolve('done')
      },
    })
  })
})

test('executes the onRequest callback of a custom extension', async t => {
  await new Promise(resolve => {
    class CustomExtension {
      async onRequest({ response }: onRequestPayload) {
        return new Promise((resolve, reject) => {

          response.writeHead(200, { 'Content-Type': 'text/plain' })
          response.end('I like cats.')

          return reject()
        })
      }
    }

    const server = newHocuspocus({
      extensions: [
        new CustomExtension(),
      ],
      async onListen() {
        const response = await fetch(server.httpURL)

        t.is(await response.text(), 'I like cats.')

        resolve('done')
      },
    })
  })
})

test('can intercept specific URLs', async t => {
  await new Promise(resolve => {
    const server = newHocuspocus({
      async onListen() {
        const interceptedResponse = await fetch(`${server.httpURL}/foobar`)
        t.is(await interceptedResponse.text(), 'I like cats.')

        const regularResponse = await fetch(server.httpURL)
        t.is(await regularResponse.text(), 'OK')
        resolve('done')
      },
      async onRequest({ response, request }: onRequestPayload) {
        if (request.url === '/foobar') {
          return new Promise((resolve, reject) => {

            response.writeHead(200, { 'Content-Type': 'text/plain' })
            response.end('I like cats.')

            return reject()
          })
        }
      },
    })
  })
})

test('has the instance', async t => {
  await new Promise(resolve => {
    const server = newHocuspocus({
      async onListen() {
        await fetch(`${server.httpURL}/foobar`)
      },
      async onRequest({ instance }) {
        t.is(instance, server)
        resolve('done')
      },
    })
  })
})