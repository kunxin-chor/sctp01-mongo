// How do see all the databases on my cluster
show databases;

// To select a database, type in `use <db-name>`
// If you type the database name wrongly,
// there will be NO error messages
use sample_airbnb;

// show all the collections in the current database
show collections;

// BASIC QUERIES
// Get all documents in a collection
// `db` is a special variable in Mongo Shell
// get the first ten documents in the `listingsAndReviews` collection
db.listingsAndReviews.find().limit(10);

// If we want to extract a subset of the key/value pairs
// is known as PROJECTION
db.listingsAndReviews.find({}, {
    "name": 1,
    "beds": 1
})

// FILTER DOCUMENTS BY A CRITERA
// The first parameter of the .find() function
// is the criteria object
db.listingsAndReviews.find({
    'beds': 2
},{
    "name":1, "beds": 1
})

// FINDING BY MUTLIPLE CRITIERA ('AND')
// Find all the documents in the collection
// where the number of beds and bedrooms is 2
db.listingsAndReviews.find({
    'beds': 2,
    'bedrooms': 2
},{
    'name':1, 'beds': 1, 'bedrooms':1
})
// FIND BY NEST OBJECT'S KEYS
// Find all the listings which has 2 beds and 2 bedrooms and are from Brazil
db.listingsAndReviews.find({
    'beds': 2,
    'bedrooms': 2,
    'address.country':"Brazil"
}, {
    'name': 1, 'beds':1 , 'bedrooms':1, 'address.country': 1
})

// FIND BY INEQUALITY
// Find all listings where they have 3 or more bedrooms
db.listingsAndReviews.find({
    'bedrooms': {
        '$gte': 3
    }
}, {
    'name': 1, 'bedrooms':1
})

// Find all listings where they have between 3 to 5 bedrooms
db.listingsAndReviews.find({
    'bedrooms': {
        '$gte': 3,
        '$lte': 5
    }
}, {
    'name': 1, 'bedrooms': 1
})

// Find all the listings in Brazil that has betewen
// 3 to 5 bedrooms and have at least 2 beds
db.listingsAndReviews.find({
    'beds':{
        '$gte': 2
    },
    'address.country':'Brazil',
    'bedrooms': {
        '$gte': 3,
        '$lte': 5
    }
}, {
    'name': 1, 'address.country':1, 'bedrooms':1, 'beds': 1
})

// FIND BY ELEMENT IN ARRAY
// Find all listings that have `Oven` in the amenities array
db.listingsAndReviews.find({
    'amenities':'Oven'
}, {
    'name': 1,
    "amenities": 1
})

// Find all listings that have Oven OR Microwave OR Stove
db.listingsAndReviews.find({
    'amenities': {
        '$in':["Oven", "Microwave", "Stove"]
    }
}, {
    'name': 1,
    'amenities': 1
})

// Find all listings that have Oven AND Microwave AND Stove
db.listingsAndReviews.find({
    'amenities':{
        '$all':["Oven", "Microwave", "Stove"]
    }
}, {
    'name': 1,
    'amenities': 1
})

// Find all listings that have Oven, BUT have either Microwave or Stove
db.listingsAndReviews.find({
    'amenities': {
        '$all':['Oven'],
        "$in":["Microwave", "BBQ Grill"]
    }
}, {
    'name': 1,
    'amenities': 1
})

// Logical Operators: OR
// Find all the listings from Brazil or Canada
db.listingsAndReviews.find({
    '$or':[
        {
            'address.country':'Brazil'
        },
        {
            'address.country':'Canada'
        }
    ]
},{
    'name': 1, 'address.country': 1
})

// For Brazil, I want number of beds to be 2
// For Canada, I want number of beds to be 3
db.listingsAndReviews.find({
    '$or':[
        {
            'address.country':'Brazil',
            'beds': 2
        },
        {
            'address.country':'Canada',
            'beds': 3
        }
    ]
},{
    'name': 1, 'address.country': 1, 'beds': 1
})

// Find all listings that have first review BEFORE 2019
// Date must be given the ISO standard - YYYY-MM-DD
db.listingsAndReviews.find({
    'first_review':{
        '$lte': ISODate("2018-12-31")
    }
}, {
    'name': 1,
    'first_review': 1
})

// count the results
// show the total number of listings
db.listingsAndReviews.find().count();

// Find by regular expression
// Find all the listings that have the string 'Spacious' in the name
db.listingsAndReviews.find({
    'name':{
        '$regex': 'spacious', '$options':'i'
    }
},{
    'name': 1
});

// Find all listings that have a review by Octavio
db.listingsAndReviews.find({
    'reviews': {
        "$elemMatch":{
            "reviewer_name":"Octavio"
        }
    }
},{
    'name': 1,
    'reviews.$': 1
})

// Find a document by its ID
use sample_restaurants;
db.restaurants.find({
    '_id':ObjectId("5eb3d668b31de5d588f42948")
})