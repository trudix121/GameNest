const SHOP_CATEGORIES = {
    roles: [
        {
            name: 'VIP Role',
            price: 1000,
            features: [
                '1.5x At Games',
                'Special Color At "My Profile" ',
                'Access To the Client App'
            ],
            id: 0,
            name_db: 'VIP'
        }
    ],
    gamePerks: [
        {
            name: 'VIP Player Status',
            price: 19.99,
            features: [
                'Special VIP tag',
                'Exclusive game lobby',
                'Priority matchmaking'
            ],
            id: 0
            
        }
    ],
    customItems: [
        {
            name: 'Custom Profile Skin',
            price: 14.99,
            features: [
                'Unique profile background',
                'Custom avatar frame',
                'Personalized profile design'
            ],
            id:0
            
        },
        {
            name: 'X2 Snake Money for 2 Hours',
            price: 10000,
            features: [
                'You Can farm a lot!'
            ],
            id: 1
        
        }
    ]
};

module.exports = SHOP_CATEGORIES