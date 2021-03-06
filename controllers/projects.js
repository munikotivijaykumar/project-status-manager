const User = require("../models/User");
var fs = require('fs');
const { Octokit } = require("@octokit/core");


exports.validCredentials = (req,res,next) =>{

    req.assert("projectId", "Not Found").notEmpty();

    req.getValidationResult(req,res,next)
    .then((result)=>{
        if(!result.isEmpty()){
            
           console.log( result.array()[0].msg)
            return res.status(400).json({
                error : true,
                message : result.array()[0].msg
            })
        }
        next();
    });
};

exports.validCreateCredentials = (req,res,next) =>{

    req.assert("title", "title Should not be Empty").notEmpty();

    req.getValidationResult(req,res,next)
    .then((result)=>{
        if(!result.isEmpty()){
            
           console.log( result.array()[0].msg)
            return res.status(400).json({
                error : true,
                message : result.array()[0].msg
            })
        }
        next();
    });
};


exports.create = async(req,res) =>{

    const {title, description} = req.body;

    const projectData = {
        title: title,
        description:description,
    }

    console.log(projectData)

    await User.findOne({_id:req.session.user.id})
    
    .then(async(r)=>{

        if(r){
            console.log(r)
            await User.findOneAndUpdate({_id:req.session.user.id},
                        { $push:{
                            projects :{ 
                                $each : [ projectData ],
                                "$sort": { name: 1 },
                                collation :{ locale: "en" }
                            },
                        }},
                        { new:true,  __v:0 }).collation({'locale':'en'})
                .then((result)=>{
                    res.json({
                        error:false,
                        msg:"Project Added",
                    })
                })
                .catch((err)=>{
                    console.log(err)
                    res.json({                 
                        error:true,
                        msg:"internal Error...!!!"
                    })
                })
        }else{
            console.log(r)
            res.json({
                error:true,
                msg:"user Doesn't exits"
            })
        }       
    })
    .catch((err)=>{
        res.json({
            error:true,
            msg:"internal Error...!"
        })
    })

};



exports.getAllProjects = async(req,res)=>{

    await User.findOne({_id:req.session.user.id})
                .then((result)=>{
                    res.json({
                        error:false,
                        data:result
                    })
                }).catch((err)=>{
                    res.json({
                        error:true,
                        msg:"err  :"+err
                    })
                })
}


exports.getProject = async(req,res)=>{

    console.log(req.body.projectId);

    await User .findOne({_id:req.session.user.id, "projects._id": req.body.projectId },{"projects.$":1})
                .then((result)=>{
                    // console.log(result.projects[0])
                    if (result) {
                        console.log(result)
                        return res.json({
                            error:false,
                            data:result.projects[0]
                        })
                    } else {
                        return res.json({
                            error:true,
                            msg:"error...!"
                        })
                    }
                    
                }).catch((err)=>{
                    res.json({
                        error:true,
                        msg:"err  :"+err
                    })
                })
}


exports.updateProject = async(req,res)=>{

    const {title, description, projectId,todos} = req.body;

    const projectData = {
        _id: projectId, 
        title: title,
        description:description,
        todos  : todos
    }


    await User.findOne({ $and:[{_id:req.session.user.id},
                        {"projects._id" :{"$eq":req.body.projectId}}]
                })
                .then(async(r)=>{
                
                    if(r){
                        console.log(r)
                        
                        await User .findOneAndUpdate({_id:req.session.user.id,"projects._id":req.body.projectId},
                                        {"projects.$" :projectData },
                                        {new:true,__v:0})
                                    .then((result)=>{
                                        console.log(result)
                                        return res.json({
                                            error:false,
                                            data:result
                                        })
                                    })
                                    .catch((err)=>{
                                        res.json({
                                            error:true,
                                            msg:"err  :"+err
                                        })
                                    })
                    }else{
                        console.log(r)
                        return res.json({
                            error:true,
                            msg:"Project Id error"
                        })
                    }
                    
                })
                .catch((err)=>{
                    console.log(err)
                    return res.json({
                        error:true,
                        msg:"internal Error...!"
                    })
                })

};

exports.deleteProject = async(req,res)=>{

    await User.findOneAndUpdate({ $and:[
                                        {_id:req.session.user.id},
                                        {"projects._id" :{"$eq":req.body.projectId}}
                                        ]},
                                { $pull :
                                    {projects :{_id : req.body.projectId}} },
                            (err, project)=>{

            if (err) {
                console.log("deletetion err")
                console.log(err)
                return res.json({
                    error:true,
                    msg:"internal error...!"
                })
            }
            if(project){
                return res.json({
                    error:false,
                    msg:"project deleted"
                })
            }
            return res.json({
                error:true,
                msg:"project Doesn't exits"
            })       
    })
              
}


exports.addTask =async(req,res)=>{

    const {todo} = req.body;

    const todoData = {
        task:req.body.todo
    }


    await User.findOneAndUpdate({ $and:[{_id:req.session.user.id},
        {"projects._id" :{"$eq":req.body.projectId}}]},
                { $push:{
                    "projects.$.todos" :{ 
                        
                        $each : [ todoData ],
                        "$sort": { date: 1 },
                        collation :{ locale: "en" }
                    }
                }},{ new:true,  __v:0 }).collation({'locale':'en'})
        .then((result)=>{
            if (result) {
                console.log("Task Added")
                res.json({
                    error:false,
                    msg:"Task Added",
                })
            } else {
                console.log("user Doesn't exits")
                res.json({
                    error:true,
                    msg:"user Doesn't exits"
                }) 
            }
            
        })
        .catch((err)=>{
            console.log(err)
            res.json({                 
                error:true,
                msg:"internal Error...!!!"
            })
        })

}

exports.updateProjectTodos = async(req,res)=>{

    const {projectId, todoId,task, status} = req.body;

    const todoData = {
        _id: todoId, 
        task: task,
        status:status
    }


    await User.findOneAndUpdate({ $and:[{_id:req.session.user.id},
                                {"projects._id" :{"$eq":req.body.projectId}},
                                {"projects.todos._id" :{"$eq":req.body.todoId}}]
                            },
                            {$set : { "projects.$[outer].todos.$[inner]" :todoData }},
                            { arrayFilters: [
                                { "outer._id": req.body.projectId },
                                { "inner._id": req.body.todoId }
                            ]})      
                            
                .then((result)=>{

                    if (result == null) {
                        console.log(result)
                        return res.json({
                            error:true,
                            msg:"Project Id error"
                        })
                        
                    }else{
                        console.log(result)
                        return res.json({
                            error:false,
                            data:result
                        })
                        
                    }
                    
                })
                .catch((err)=>{
                    console.log(err)
                    res.json({
                        error:true,
                        msg:"err  :"+err
                    })
                })


};

exports.getTask =()=>{

}

exports.deleteTask =async(req,res)=>{

    await User.findOneAndUpdate({ $and:
                                    [{_id:req.session.user.id},
                                     {"projects._id" :{"$eq":req.body.projectId}}
                                    ]},
                                { $pull :
                                    {
                                        "projects.$.todos" :{_id : req.body.todoId}} 
                                    },
                            (err, todo)=>{

            if (err) {
                console.log("deletetion err")
                console.log(err)
                return res.json({
                    error:true,
                    msg:"internal error...!"
                })
            }
            if(todo){
                return res.json({
                    error:false,
                    msg:"Todo deleted"
                })
            }
            return res.json({
                error:true,
                msg:"project Doesn't exits"
            })       
    })
    
}

exports.exportGist = async(req,res)=>{

    console.log(require("../helpers/githubAuth").githubAccessToken)
    const octokit = new Octokit({ auth:require("../helpers/githubAuth").githubAccessToken });
    var mdfile = await fs.writeFile('mynewfile3.md', req.body.mdData, function (err) {
        if (err) throw err;
        console.log('Saved!');
        res.json({
            sucess:true,
            error:false
        })
    });
    
    // var kprojectFile = `${projectname}.md`
    await octokit.request('POST /gists', {
        files: {
            [`${req.body.projectName}.md`]: {
              "content": req.body.mdData
            }}
      })
      .then((r)=>{
        console.log(r)
      })
      .catch(err=>{
          console.log(err)
      })

    //   const response = await fetch('https://api.github.com/gists' ,{

    //     method: "POST",
    //     headers: {
    //       Accept: "application/vnd.github.v3+json",
    //       "Content-Type": "application/json"
    //     },
        
    //     body :{
    //         files:mdfile
    //     },
    //     files:{projectName : req.body.mdData }
    //   })

    //   console.log(response)
}