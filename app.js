//jshint esversion:6
const express = require("express")
const bodyParser = require("body-parser")
const app = express()
const mongoose = require("mongoose")
const { stringify } = require("nodemon/lib/utils")
const _ = require("lodash")

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

app.set('view engine', 'ejs') //setting up EJS. The view engine(here EJS) will look for all pages in views folder.
// var text = "" //but here every time we make a post request our item gets updated , we don't want that. Therefore:
// var items = ["Buy Food","Cook Food","Eat Food"] //we create an array of items(more items will be added)


mongoose.connect("mongodb+srv://Snehashish008:Sneha%40todolist.com@cluster1.i6xko.mongodb.net/todoListDB?retryWrites=true&w=majority", {  //%40 means @ in ASCII
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const itemsSchema = new mongoose.Schema({
    name: String
})

const item = new mongoose.model("item", itemsSchema)

const newItemsSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const newItem = new mongoose.model("newItem", newItemsSchema)

var defaultItems = []
var topic = ""
const default_doc = async () => {
    try {

        // INSERT MULTIPLE DOCUMENTS AT ONCE:
        const item1 = new item({
            name: "Wake Up"
        })
        const item2 = new item({
            name: "Play Games"
        })
        const item3 = new item({
            name: "Sleep"
        })
        defaultItems = [item1, item2, item3]
    }
    catch (err) {
        console.log("Error in try block: " + err)
    }
}
default_doc()
//[Note: When server starts it first reaches out to app.get()]

app.get("/", function (req, res) {
    // var today = new Date()
    // var currentDay = today.getDay() //fetches the current date in numbers.
    var event = new Date();
    var options = { weekday: 'long' };
    var day = event.toLocaleDateString('en-US', options); //returns the current day name instead of day number
    res.set("Content-Type", "text/html");

    // if (currentDay == 6 || currentDay == 0) { //6-> sat, 0->sun, 1->mon, 2->Tue, 3->Wed ...
    //     // res.write("Today is Holiday.")
    //     day = "Weekend"
    // }
    // else {
    //     // res.write("<h2>Today is working day.</h2>")
    //     // res.write("Work Fatman work!!")
    //     day = "Weekday"
    // }

    const listArr = item.find({}, function (err, foundItems) { //since simple find() returns (array of array) of databases ,
        // we need to grab on to a specific array of database

        if (foundItems.length == 0) {
            //following line inserts/saves many documnets of 'items' at once.
            const resultAll = item.insertMany(defaultItems) //In this way the server does not add the data over and over again
            //currently foundItems = 0 evenafter insertion therefore we again have to *redirect* to "/" <-root route to 
            res.redirect("/")
        }

        res.render("list", { KindofDay: "today", newListItem: foundItems, items_length: foundItems.length }) //the KindofDay of list.ejs = day of app.js
        //in an app we can render only once therefore we didnit render in app.post() rather we directed app.post() to
        //root directory/app.get() and hence render again gets executed, now with newListItem

    })

})

app.post("/", function (req, res) {
    var itemNew = req.body.new_item
    var postName = req.body.list
    const item4 = new item({ //another way of creating document
        name: itemNew
    })
    //or item.save()
    if (postName == "today") {
        item.insertMany([item4,])
        res.redirect("/") //redirects to app.get()

    } else {
        const listArr = newItem.findOne({ name: postName }, function (err, foundItem) {
            if (foundItem) {
                foundItem.items.push(item4)
                foundItem.save(function () {
                    res.redirect("/" + postName)
                })
            }
            else if (err) {
                console.log(err + "\n\n");
            }
        })
    }
})

app.get("/:postName", function (req, res) {

    topic = req.params.postName;
    topic = _.capitalize(topic)
    const default_doc1 = async () => {
        try {
            const listArr = newItem.findOne({ name: topic }, function (err, foundItems) {  //finds one document rather than a list of documents as in find()
                if (!err) {
                    if (!foundItems) {
                        //create new item
                        const item5 = new newItem({
                            name: topic,
                            items: defaultItems
                        })
                        newItem.insertMany([item5,])
                        res.redirect("/" + topic) //avoiding leaving the user hanging
                    }
                    else {
                        //display new item
                        res.render("list", { KindofDay: foundItems.name, newListItem: foundItems.items, items_length: foundItems.items.length })
                    }
                }
            })
        }
        catch (err) {
            console.log(err)
        }
    }
    default_doc1()
})

app.post("/delete", function (req, res) {

    const itemToBeDel_id = req.body.checkbox
    const newItemToBeDel_name = req.body.newRouteName
    if (newItemToBeDel_name == "today") {
        item.findByIdAndRemove(itemToBeDel_id, function (err) { //note: without the call back this will only find the id and not remove it
            console.log("Successfully deleted the item")
        })
        res.redirect("/") //redirects to the app.get("/") to show the updated list
    }else{

        newItem.findOneAndUpdate({name:newItemToBeDel_name},{$pull:{items:{_id:itemToBeDel_id}}},function(err,foundItem){   //finds an item deletes any found matching document from the array
            if(!err){
                res.redirect("/"+newItemToBeDel_name)
            }
        })   //condition, pull request, fn callback
    }
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5500;
}
 
app.listen(port, function() {
  console.log("Server started succesfully");
});  