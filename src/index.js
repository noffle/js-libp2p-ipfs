'use strict'

const Swarm = require('libp2p-swarm')
const Peer = require('peer-info')
const TCP = require('libp2p-tcp')
// const UTP = require('libp2p-utp')
const WS = require('libp2p-websockets')
const spdy = require('libp2p-spdy')
const multiaddr = require('multiaddr')
const mafmt = require('mafmt')
const parallel = require('run-parallel')

exports = module.exports

exports.Node = function Node (peerInfo) {
  if (!(this instanceof Node)) {
    return new Node(peerInfo)
  }
  if (!peerInfo) {
    peerInfo = new Peer()
    peerInfo.multiaddr.add(multiaddr('/ip4/0.0.0.0/tcp/0'))
  }

  const transports = {
    tcp: {
      constructor: TCP,
      matcher: mafmt.TCP
    },
    ws: {
      constructor: WS,
      matcher: mafmt.WebSockets
    }
  }
  const addrs = peerInfo.multiaddrs
  const availableTransports = Object.keys(transports).filter((ts) => {
    // Only listen on transports we actually have addresses for
    const matches = addrs.filter((addr) => {
      return transports[ts].matcher.matches(addr)
    })
    return matches.length > 0
  })

  // Swarm
  this.swarm = new Swarm(peerInfo)
  availableTransports.forEach((ts) => {
    const Constructor = transports[ts].constructor
    this.swarm.transport.add(ts, new Constructor())
  })
  this.swarm.connection.addStreamMuxer(spdy)
  // this.swarm.connection.reuse()

  this.start = (done) => {
    parallel(availableTransports.map((ts) => (cb) => {
      // Listen on the given transport
      this.swarm.transport.listen(ts, {}, null, cb)
    }), done)
  }

  this.routing = null
  this.records = null

  this.dial = () => {
    throw new Error('THIS WILL BE EQUIVALENT TO THE ROUTED HOST FEATURE, IT WILL FIGURE OUT EVERYTHING :D')
  }
}
