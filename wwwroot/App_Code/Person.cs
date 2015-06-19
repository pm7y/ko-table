using System;
using Newtonsoft.Json;

public class Person
{
    //[JsonProperty("id")]
    public int id { get; set; }

    //[JsonProperty("isActive")]
    public bool isActive { get; set; }

    //[JsonProperty("age")]
    public int age { get; set; }

    //[JsonProperty("name")]
    public string name { get; set; }

    [JsonIgnoreAttribute]
    public string gender { get; set; }

    //[JsonProperty("company")]
    public string company { get; set; }

    //[JsonProperty("email")]
    public string email { get; set; }

    //[JsonProperty("phone")]
    public string phone { get; set; }
}
