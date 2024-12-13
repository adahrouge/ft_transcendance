/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_substr.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: abouraad <abouraad@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/12 14:09:17 by abouraad          #+#    #+#             */
/*   Updated: 2024/08/08 14:06:15 by abouraad         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

char	*ft_substr(char const *s, unsigned int start, size_t len)
{
	size_t	i;
	size_t	j;
	size_t	l;
	char	*newstr;

	if (!s)
		return (NULL);
	l = ft_strlen(s);
	if (l - start < len)
		len = l - start;
	else if (start > l)
		len = 0;
	newstr = (char *)malloc(sizeof(char) * (len + 1));
	if (!newstr)
		return (NULL);
	i = (size_t)start;
	j = 0;
	while (i < l && j < len)
	{
		newstr[j] = s[i];
		i++;
		j++;
	}
	newstr[j] = '\0';
	return (newstr);
}
