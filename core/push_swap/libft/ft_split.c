/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_split.c                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: abouraad <abouraad@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/12 14:15:55 by abouraad          #+#    #+#             */
/*   Updated: 2024/08/08 14:04:37 by abouraad         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static char	**ft_splitfnorm(size_t size, size_t len, char *str, char **r)
{
	size_t	i;
	size_t	j;

	i = 0;
	j = 0;
	while (i < len)
	{
		if (str[i])
			break ;
		i++;
	}
	while (size--)
	{
		r[j] = ft_strdup(str + i++);
		if (!(r[j]))
			return (NULL);
		j++;
		while (i < len)
		{
			if (!(str[i - 1]) && str[i])
				break ;
			i++;
		}
	}
	return (r);
}

static size_t	ft_strcountnull(char *str, char c, size_t len)
{
	size_t	size;
	size_t	i;

	i = 0;
	size = 0;
	while (i < len)
	{
		if (str[i] != c)
		{
			if (str[i + 1] == c || !str[i + 1])
				size++;
		}
		else
			str[i] = '\0';
		i++;
	}
	return (size);
}

char	**ft_split(char const *s, char c)
{
	size_t	size;
	size_t	len;
	char	*str;
	char	**res;

	if (!s)
		return (NULL);
	str = ft_strdup(s);
	if (!str)
		return (NULL);
	len = ft_strlen(str);
	size = ft_strcountnull(str, c, len);
	res = (char **)malloc(sizeof(char *) * (size + 1));
	if (!res)
		return (NULL);
	res = ft_splitfnorm(size, len, str, res);
	free(str);
	res[size] = NULL;
	return (res);
}
