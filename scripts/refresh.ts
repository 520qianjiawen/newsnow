import process from "node:process"
import { sources } from "../shared/sources"

Promise.all(Object.keys(sources).map(id =>
  fetch(`https://newsnow.busiyi.world/api/s/${id}?latest`, {
    headers: {
      Authorization: `Bearer ${process.env.JWT_TOKEN}`,
    },
  }),
)).catch(console.error)
