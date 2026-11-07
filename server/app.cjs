// Entry point for Plesk / Phusion Passenger, which loads the startup file with require().
// The app itself is an ES module, so load it dynamically.
import('./index.js').catch(err => {
  console.error(err)
  process.exit(1)
})
