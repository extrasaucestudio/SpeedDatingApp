import mongoose from 'mongoose';
import Event from './models/event';
import Person from './models/person';
import assert from 'assert';
import _ from 'lodash';


handleError = (err) => {
  console.log(err);
}

mongoose.connect('mongodb://localhost/events', {
  useMongoClient: true,
  /* other options */
});
 
const organizer = new Person ({
  oauth_id: '12312312113',
  name: 'testname',
  avatar: 'https://i.imgur.com/po7UezG.jpg',
  age: '24',
  gender: 2,
  likes: {},
  events: []
});

organizer.save(function (err) {
  let manage_ids = [];
  manage_ids.push(organizer._id);

  if (err) return handleError(err);
  var event = new Event({
    title: "Once upon a timex.",
    _creator: organizer._id,    // assign the _id from the person
    photo : 'https://i.imgur.com/po7UezG.jpg',
    description: 'Some description', 
    places_max: 20,
    cost_men: 1000,
    cost_women: 300,
    date : Date.now(),
    show_manage: true,
    manage_ids: manage_ids,
    participant_ids: [],
    participants: [],
    likes: [],
    matches: {},
    table_max: 10
    // tables: _.range(1, 11)
  });

  event.save(function (err) {
    if (err) return handleError(err);
    // thats it!
  });
});
 