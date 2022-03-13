import order from '../../src/order';

describe('orderJson', () => {
    test('should return json ordered alphabetically by property name', () => {
        expect(
            order({
                _id: '6223fbad35687c97fd227957',
                index: 0,
                guid: 'af604232-484d-4706-8867-d1a5789e8c76',
                isActive: true,
                balance: '$1,141.86',
                picture: 'http://placehold.it/32x32',
                age: 35,
                eyeColor: 'blue',
                name: 'Jacqueline Wooten',
                gender: 'female',
                company: 'TERRAGEN',
                email: 'jacquelinewooten@terragen.com',
                phone: '+1 (875) 405-2646',
                address: '436 Taylor Street, Manchester, Washington, 8727',
                about: 'Nulla non eu laboris eu eu laboris duis ipsum. Dolore nostrud qui aliquip velit. Eu minim reprehenderit elit cillum sunt. Aliquip ut et fugiat consectetur veniam tempor eiusmod. Mollit officia laboris aute dolor incididunt id pariatur dolore non ut culpa ullamco enim. Ad ex ipsum irure fugiat laboris magna culpa.\r\n',
                registered: '2017-03-15T09:16:34 -00:00',
                latitude: 0.848836,
                longitude: 70.415866,
                tags: [
                    'esse',
                    'ea',
                    'dolore',
                    'velit',
                    'sint',
                    'deserunt',
                    'occaecat',
                ],
                friends: [
                    {
                        id: 0,
                        name: 'Tracy Harding',
                        age: 50,
                    },
                    {
                        id: 1,
                        name: 'Hodge Harrington',
                        age: 24,
                    },
                    {
                        id: 2,
                        name: 'Pierce Bailey',
                        age: 74,
                    },
                ],
                greeting:
                    'Hello, Jacqueline Wooten! You have 4 unread messages.',
                favoriteFruit: 'banana',
            })
        ).toEqual({
            about: 'Nulla non eu laboris eu eu laboris duis ipsum. Dolore nostrud qui aliquip velit. Eu minim reprehenderit elit cillum sunt. Aliquip ut et fugiat consectetur veniam tempor eiusmod. Mollit officia laboris aute dolor incididunt id pariatur dolore non ut culpa ullamco enim. Ad ex ipsum irure fugiat laboris magna culpa.\r\n',
            address: '436 Taylor Street, Manchester, Washington, 8727',
            age: 35,
            balance: '$1,141.86',
            company: 'TERRAGEN',
            email: 'jacquelinewooten@terragen.com',
            eyeColor: 'blue',
            favoriteFruit: 'banana',
            friends: [
                {
                    age: 50,
                    id: 0,
                    name: 'Tracy Harding',
                },
                {
                    age: 24,
                    id: 1,
                    name: 'Hodge Harrington',
                },
                {
                    age: 74,
                    id: 2,
                    name: 'Pierce Bailey',
                },
            ],
            gender: 'female',
            greeting: 'Hello, Jacqueline Wooten! You have 4 unread messages.',
            guid: 'af604232-484d-4706-8867-d1a5789e8c76',
            latitude: 0.848836,
            _id: '6223fbad35687c97fd227957',
            index: 0,
            longitude: 70.415866,
            isActive: true,
            name: 'Jacqueline Wooten',
            phone: '+1 (875) 405-2646',
            picture: 'http://placehold.it/32x32',
            registered: '2017-03-15T09:16:34 -00:00',
            tags: [
                'esse',
                'ea',
                'dolore',
                'velit',
                'sint',
                'deserunt',
                'occaecat',
            ],
        });
    });
});
