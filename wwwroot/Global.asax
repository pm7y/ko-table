<%@ Application Language="C#" %>
<%@ Import Namespace="System.Net.Http" %>
<%@ Import Namespace="System.Web.Http" %>
<%@ Import Namespace="System.Web.Http.Routing" %>


<script runat="server">
    protected void Application_Start(object sender, EventArgs e)
    {
        var routes = GlobalConfiguration.Configuration.Routes;

        routes.MapHttpRoute("DefaultApiWithId", "api/{controller}/{id}", new { id = System.Web.Http.RouteParameter.Optional }, new { id = @"\d+" });
        routes.MapHttpRoute("DefaultApiWithAction", "api/{controller}/{action}");
        routes.MapHttpRoute("DefaultApiGet", "api/{controller}", new { action = "Get" }, new { httpMethod = new HttpMethodConstraint(HttpMethod.Get) });
        routes.MapHttpRoute("DefaultApiPost", "api/{controller}", new { action = "Post" }, new { httpMethod = new HttpMethodConstraint(HttpMethod.Post) });
    }
</script>
