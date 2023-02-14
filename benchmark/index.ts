import { request, Request, Response } from "express";
import {
  PerformanceObserver,
  PerformanceEntry,
  PerformanceObserverEntryList,
  performance,
} from "perf_hooks";

import { HMAC } from "./../src/index";

interface TransformedEntry {
  operations: number;
  duration: number;
  throughput: string;
}

const COUNT = 1000000;
const REQUEST = request;
REQUEST.headers = {
  authorization:
    "HMAC 1573504737300:76251c6323fbf6355f23816a4c2e12edfd10672517104763ab1b10f078277f86",
};
REQUEST.method = "POST";
REQUEST.originalUrl = "/api/order";
REQUEST.body = {
  foo: "bar",
};

function transformObserverEntry(entry: PerformanceEntry): TransformedEntry {
  return {
    operations: COUNT,
    duration: entry.duration,
    throughput: `~${(COUNT / (entry.duration / 1000)).toFixed(0)} ops/second`,
  };
}

(function run(): void {
  const observer: PerformanceObserver = new PerformanceObserver(
    (items: PerformanceObserverEntryList): void =>
      console.log(
        items.getEntries().map((entry) => transformObserverEntry(entry))
      )
  );
  const middleware = HMAC("secret");
  observer.observe({ type: "measure" });

  performance.mark(`iterations`);
  for (let i = 0; i < COUNT; i++) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    middleware(REQUEST as Request, {} as Response, () => {});
  }
  performance.mark(`endIterations`);
  performance.measure("Total", "iterations", "endIterations");
})();
