import order from "../../src/order.js";
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";

describe("orderJson", () => {
  it("should return json ordered alphabetically by property name", () => {
    const input = {
      _id: "6223fbad35687c97fd227957",
      index: 0,
      guid: "af604232-484d-4706-8867-d1a5789e8c76",
      isActive: true,
      balance: "$1,141.86",
      picture: "http://placehold.it/32x32",
      age: 35,
      eyeColor: "blue",
      name: "Jacqueline Wooten",
      gender: "female",
      company: "TERRAGEN",
      email: "jacquelinewooten@terragen.com",
      phone: "+1 (875) 405-2646",
      address: "436 Taylor Street, Manchester, Washington, 8727",
      about:
        "Nulla non eu laboris eu eu laboris duis ipsum. Dolore nostrud qui aliquip velit. Eu minim reprehenderit elit cillum sunt. Aliquip ut et fugiat consectetur veniam tempor eiusmod. Mollit officia laboris aute dolor incididunt id pariatur dolore non ut culpa ullamco enim. Ad ex ipsum irure fugiat laboris magna culpa.\r\n",
      registered: "2017-03-15T09:16:34 -00:00",
      latitude: 0.848836,
      longitude: 70.415866,
      tags: ["esse", "ea", "dolore", "velit", "sint", "deserunt", "occaecat"],
      friends: [
        {
          id: 0,
          name: "Tracy Harding",
          age: 50,
        },
        {
          id: 1,
          name: "Hodge Harrington",
          age: 24,
        },
        {
          id: 2,
          name: "Pierce Bailey",
          age: 74,
        },
      ],
      greeting: "Hello, Jacqueline Wooten! You have 4 unread messages.",
      favoriteFruit: "banana",
    };

    const output = {
      _id: "6223fbad35687c97fd227957",
      about:
        "Nulla non eu laboris eu eu laboris duis ipsum. Dolore nostrud qui aliquip velit. Eu minim reprehenderit elit cillum sunt. Aliquip ut et fugiat consectetur veniam tempor eiusmod. Mollit officia laboris aute dolor incididunt id pariatur dolore non ut culpa ullamco enim. Ad ex ipsum irure fugiat laboris magna culpa.\r\n",
      address: "436 Taylor Street, Manchester, Washington, 8727",
      age: 35,
      balance: "$1,141.86",
      company: "TERRAGEN",
      email: "jacquelinewooten@terragen.com",
      eyeColor: "blue",
      favoriteFruit: "banana",
      friends: [
        {
          age: 50,
          id: 0,
          name: "Tracy Harding",
        },
        {
          age: 24,
          id: 1,
          name: "Hodge Harrington",
        },
        {
          age: 74,
          id: 2,
          name: "Pierce Bailey",
        },
      ],
      gender: "female",
      greeting: "Hello, Jacqueline Wooten! You have 4 unread messages.",
      guid: "af604232-484d-4706-8867-d1a5789e8c76",
      index: 0,
      isActive: true,
      latitude: 0.848836,
      longitude: 70.415866,
      name: "Jacqueline Wooten",
      phone: "+1 (875) 405-2646",
      picture: "http://placehold.it/32x32",
      registered: "2017-03-15T09:16:34 -00:00",
      tags: ["esse", "ea", "dolore", "velit", "sint", "deserunt", "occaecat"],
    };

    const ordered = order(input) as typeof input;

    // does not check key order, but does check values, so we still do this to ensure our order function
    // does not change any values
    assert.deepEqual(ordered, output);
    // we could add recursion here to check all nested keys manually, but as this case is simple, manually check
    assert.deepEqual(Object.keys(ordered), Object.keys(output));
    assert.deepEqual(
      Object.keys(ordered.friends[0] as {}),
      Object.keys(output.friends[0] as {}),
    );
  });
});
