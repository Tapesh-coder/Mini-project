const express=require('express')
const app=express();
const userModel=require('./models/user')
const postModel=require('./models/post')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const cookieParser=require('cookie-parser')


app.set('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())


app.get('/',(req,res)=>{
    res.render('index')
})
 
app.get('/like/:id',isLoggedIN,async (req,res)=>{
let post=await postModel.findOne({_id:req.params.id}).populate('user')
if(post.likes.indexOf(req.user.userid)==-1)
{
    post.likes.push(req.user.userid) 
}
else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
}
post.save()
res.redirect('/profile')



})



app.get('/profile',isLoggedIN,async (req,res)=>{
let user=await userModel.findOne({email:req.user.email}).populate('posts')

    res.render('profile',{user:user})
})


app.get('/login',(req,res)=>{
    res.render('login')
})

app.get('/logout',(req,res)=>{
    res.cookie('token',"")
    res.redirect('/login')
})


app.post('/register',async (req,res)=>{
    let user=await userModel.findOne({email:req.body.email})
    if (user!=null)
    {
        res.send('something went wrong')
    }
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(req.body.password, salt,  async function(err, hash) {
            let data=await userModel.create({
                name:req.body.name,
                password:hash,
                username:req.body.username,
                email:req.body.email,
                age:req.body.age

            })
           let token= jwt.sign({email:req.body.email,userid:data._id},'secrretttt')
           res.cookie('token',token)
           
            
           res.send('registered')
            
            
        });
    })
    

})
app.post('/login',async (req,res)=>{
    let user= await userModel.findOne({email:req.body.email})
    if (user===null)
    {
         return res.send('Something went wrong')
    }
    bcrypt.compare(req.body.password,user.password,(err,result)=>{
        if (result==false)
        {
             return res.redirect('/login')
        }
        let token= jwt.sign({email:req.body.email,userid:user._id},'secrretttt')
        res.cookie('token',token)
          

       return res.redirect('/profile')
        
    })
})

app.post('/posts',isLoggedIN,async (req,res)=>{
let user=await userModel.findOne({email:req.user.email})
let post=await postModel.create({
    user:user._id,
    content: req.body.content
})
user.posts.push(post._id)
 await user.save()


res.redirect('/profile')
})

app.get('/edit/:id',isLoggedIN,async(req,res)=>{
let post=await postModel.findOne({_id:req.params.id}).populate('user')
    res.render('edit',{post:post})
})
app.post('/update/:id',isLoggedIN,async(req,res)=>{
    let update=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content})
    res.redirect('/profile')
})


app.get('/delete/:id',isLoggedIN,async (req,res)=>{
    let deleted= await postModel.findOneAndDelete({_id:req.params.id})
    let user=await userModel.findOne({_id:req.user.userid})
    
user.posts.splice(user.posts.indexOf(req.params.id))
await user.save()
res.redirect('/profile')
})


function isLoggedIN(req,res,next){
    if(req.cookies.token==="")
    {
        return res.redirect('/login')
    }
    else{
       let data= jwt.verify(req.cookies.token,'secrretttt')
       req.user=data
    }
    next();
}



app.listen(3000)