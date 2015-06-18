using System;
using Newtonsoft.Json;

public class Person
{
    [JsonProperty("id")]
    public int PersonId { get; set; }

    [JsonProperty("isActive")]
    public bool Active { get; set; }

    [JsonProperty("age")]
    public int Age { get; set; }

    [JsonProperty("name")]
    public string Fullname { get; set; }

    [JsonProperty("gender")]
    [JsonIgnoreAttribute]
    public string Gender { get; set; }

    [JsonProperty("company")]
    public string Company { get; set; }

    [JsonProperty("email")]
    public string Email { get; set; }

    [JsonProperty("phone")]
    public string PhoneNumber { get; set; }
}
