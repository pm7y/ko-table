<%@ Application Language="C#" %>
<%@ Import Namespace="System.Web.Http" %>

<script runat="server">
    protected void Application_Start(object sender, EventArgs e) 
    {
        GlobalConfiguration.Configuration.Routes.MapHttpRoute("DefaultApi", "api/{controller}/{id}", new { id = System.Web.Http.RouteParameter.Optional });
    }
</script>
